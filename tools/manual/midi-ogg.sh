#!/usr/bin/env bash

set -Eeuo pipefail

DEFAULT_GAIN_DB="0"
DEFAULT_OGG_QUALITY="5"
DEFAULT_TARGET_LUFS="-14"
DEFAULT_TARGET_TRUE_PEAK_DB="-1"
SOUNDFONT_URL="https://archive.org/download/free-soundfonts-sf2-2019-04"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

usage() {
    cat <<'HELP'
Usage:
  midi-ogg.sh -h
  midi-ogg.sh render <folder> [--gain <dB>] [--quality <0-10>]
  midi-ogg.sh volume <folder> [--lufs <LUFS>] [--peak <dBTP>]

Commands:
  render <folder>
      Render non-recursive .mid/.midi files in <folder> into two styles:
        modern/  using Microsoft_gm.sf2
        8bit/    using 8bitsf.SF2

      SoundFont files are loaded from the directory containing this script.
      Existing modern/ and 8bit/ directories are deleted and regenerated.

      Options:
        --gain <dB>       Output gain in dB (default: 0)
        --quality <0-10>  OGG Vorbis quality (default: 5)

  volume <folder>
      Recursively scan all .ogg files under <folder> and analyze perceived
      loudness (EBU R128 / LUFS), loudness range, sample peak and true peak.

      For each file, show:
        TARGET GAIN  Gain needed to reach the LUFS target.
        SAFE MAX     Maximum gain allowed by the true-peak ceiling.
        USE GAIN     The lower of TARGET GAIN and SAFE MAX.

      The final overall loudness gain is based on the median LUFS across all
      readable tracks, then limited by the safest true peak in the whole set.

      Options:
        --lufs <LUFS>     Integrated loudness target (default: -14)
        --peak <dBTP>     True-peak ceiling (default: -1)

Examples:
  midi-ogg.sh render ./
  midi-ogg.sh render ./midi --gain -3 --quality 6
  midi-ogg.sh volume ./modern
  midi-ogg.sh volume ./ --lufs -16 --peak -1
HELP
}
error() {
    echo "error: $*" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || error "$1 not found"
}

normalize_dir() {
    local dir="$1"
    [[ -d "$dir" ]] || error "folder not found: $dir"
    (
        cd "$dir"
        pwd -P
    )
}

render_command() {
    local dir=""
    local gain_db="$DEFAULT_GAIN_DB"
    local ogg_quality="$DEFAULT_OGG_QUALITY"

    while (($#)); do
        case "$1" in
            --gain)
                (($# >= 2)) || error "--gain requires a value"
                gain_db="$2"
                shift 2
                ;;
            --quality)
                (($# >= 2)) || error "--quality requires a value"
                ogg_quality="$2"
                shift 2
                ;;
            -h|--help)
                usage
                return 0
                ;;
            --)
                shift
                (($#)) || error "render requires <folder>"
                [[ -z "$dir" ]] || error "render accepts only one folder"
                dir="$1"
                shift
                ;;
            -* )
                error "unknown render option: $1"
                ;;
            *)
                [[ -z "$dir" ]] || error "render accepts only one folder"
                dir="$1"
                shift
                ;;
        esac
    done

    [[ -n "$dir" ]] || error "render requires <folder>"

    [[ "$gain_db" =~ ^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$ ]] || \
        error "invalid --gain value: $gain_db"
    [[ "$ogg_quality" =~ ^([0-9]|10)([.][0-9]+)?$ ]] || \
        error "invalid --quality value: $ogg_quality"

    dir="$(normalize_dir "$dir")"

    local modern_sf2="$SCRIPT_DIR/Microsoft_gm.sf2"
    local bit8_sf2="$SCRIPT_DIR/8bitsf.SF2"
    local missing=()

    [[ -f "$modern_sf2" ]] || missing+=("Microsoft_gm.sf2")
    [[ -f "$bit8_sf2" ]] || missing+=("8bitsf.SF2")

    if ((${#missing[@]})); then
        echo "error: missing required SoundFont file(s) next to this script:" >&2
        printf '  - %s\n' "${missing[@]}" >&2
        echo >&2
        echo "Download them from:" >&2
        echo "  $SOUNDFONT_URL" >&2
        exit 1
    fi

    require_command fluidsynth
    require_command ffmpeg

    shopt -s nullglob nocaseglob
    local midis=("$dir"/*.mid "$dir"/*.midi)
    shopt -u nocaseglob

    ((${#midis[@]})) || error "no .mid/.midi files found directly in: $dir"

    local modern_dir="$dir/modern"
    local bit8_dir="$dir/8bit"

    rm -rf -- "$modern_dir" "$bit8_dir"
    mkdir -p -- "$modern_dir" "$bit8_dir"

    local tmp_dir
    tmp_dir="$(mktemp -d)"
    trap 'rm -rf -- "$tmp_dir"' EXIT

    echo "MIDI files : ${#midis[@]}"
    echo "Gain       : ${gain_db} dB"
    echo "OGG quality: ${ogg_quality}"
    echo

    local style sf2 out_dir midi midi_file midi_name tmp_wav output
    for style in modern 8bit; do
        case "$style" in
            modern)
                sf2="$modern_sf2"
                out_dir="$modern_dir"
                ;;
            8bit)
                sf2="$bit8_sf2"
                out_dir="$bit8_dir"
                ;;
        esac

        echo "==> $style ($(basename "$sf2"))"

        for midi in "${midis[@]}"; do
            midi_file="$(basename "$midi")"
            midi_name="${midi_file%.*}"
            tmp_wav="$tmp_dir/${style}_${midi_name}.wav"
            output="$out_dir/$midi_name.ogg"

            echo "    $midi_file -> ${output#$dir/}"

            fluidsynth \
                -ni \
                -F "$tmp_wav" \
                "$sf2" \
                "$midi"

            ffmpeg \
                -hide_banner \
                -loglevel error \
                -y \
                -i "$tmp_wav" \
                -af "volume=${gain_db}dB" \
                -c:a libvorbis \
                -q:a "$ogg_quality" \
                "$output"

            rm -f -- "$tmp_wav"
        done

        echo
    done

    trap - EXIT
    rm -rf -- "$tmp_dir"
    echo "Done."
}

volume_command() {
    local dir=""
    local target_lufs="$DEFAULT_TARGET_LUFS"
    local target_tp="$DEFAULT_TARGET_TRUE_PEAK_DB"

    while (($#)); do
        case "$1" in
            --lufs)
                (($# >= 2)) || error "--lufs requires a value"
                target_lufs="$2"
                shift 2
                ;;
            --peak)
                (($# >= 2)) || error "--peak requires a value"
                target_tp="$2"
                shift 2
                ;;
            -h|--help)
                usage
                return 0
                ;;
            --)
                shift
                (($#)) || error "volume requires <folder>"
                [[ -z "$dir" ]] || error "volume accepts only one folder"
                dir="$1"
                shift
                ;;
            -* )
                # 负数只能作为 --lufs 或 --peak 的参数出现。
                error "unknown volume option: $1"
                ;;
            *)
                [[ -z "$dir" ]] || error "volume accepts only one folder"
                dir="$1"
                shift
                ;;
        esac
    done

    [[ -n "$dir" ]] || error "volume requires <folder>"
    [[ "$target_lufs" =~ ^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$ ]] || \
        error "invalid --lufs value: $target_lufs"
    [[ "$target_tp" =~ ^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$ ]] || \
        error "invalid --peak value: $target_tp"

    awk -v v="$target_lufs" 'BEGIN { exit !(v >= -70 && v <= -5) }' || \
        error "--lufs must be between -70 and -5"
    awk -v v="$target_tp" 'BEGIN { exit !(v >= -9 && v <= 0) }' || \
        error "--peak must be between -9 and 0"

    require_command ffmpeg
    require_command awk
    require_command find
    require_command sort

    dir="$(normalize_dir "$dir")"

    local -a oggs=()
    while IFS= read -r -d '' file; do
        oggs+=("$file")
    done < <(find "$dir" -type f -iname '*.ogg' -print0 | sort -z)

    ((${#oggs[@]})) || error "no .ogg files found under: $dir"

    format_number() {
        local value="$1"
        case "$value" in
            inf|+inf) printf '+inf' ;;
            -inf)     printf '%s' '-inf' ;;
            *) awk -v v="$value" 'BEGIN { if (v > 0) printf "+%.2f", v; else printf "%.2f", v }' ;;
        esac
    }

    json_stat() {
        local key="$1"
        awk -F'"' -v key="$key" '$2 == key { print $4; exit }'
    }

    echo "Targets: ${target_lufs} LUFS, ${target_tp} dBTP true peak"
    echo
    printf '%9s  %7s  %8s  %8s  %11s  %9s  %9s  %s\n' \
        "LUFS" "LRA" "PEAK" "TP" "TARGET" "SAFE MAX" "USE GAIN" "FILE"
    printf '%9s  %7s  %8s  %8s  %11s  %9s  %9s  %s\n' \
        "---------" "-------" "--------" "--------" "-----------" "---------" "---------" "----"

    local file loud_output vol_output lufs lra true_peak sample_peak
    local target_gain safe_gain use_gain rel
    local overall_safe_gain=""
    local -a lufs_values=()

    for file in "${oggs[@]}"; do
        loud_output="$(
            ffmpeg -hide_banner -nostats -i "$file" \
                -af "loudnorm=I=${target_lufs}:TP=${target_tp}:LRA=11:print_format=json" \
                -f null - 2>&1 || true
        )"

        lufs="$(json_stat input_i <<<"$loud_output")"
        lra="$(json_stat input_lra <<<"$loud_output")"
        true_peak="$(json_stat input_tp <<<"$loud_output")"

        vol_output="$(ffmpeg -hide_banner -nostats -i "$file" -af volumedetect -f null - 2>&1 || true)"
        sample_peak="$(awk '/max_volume:/ {v=$(NF-1)} END {print v}' <<<"$vol_output")"

        rel="${file#$dir/}"

        if [[ -z "$lufs" || -z "$true_peak" || "$lufs" == "-inf" || "$true_peak" == "-inf" ]]; then
            printf '%9s  %7s  %8s  %8s  %11s  %9s  %9s  %s\n' \
                "${lufs:-n/a}" "${lra:-n/a}" "${sample_peak:-n/a}" "${true_peak:-n/a}" \
                "n/a" "n/a" "n/a" "$rel"
            continue
        fi

        target_gain="$(awk -v target="$target_lufs" -v measured="$lufs" \
            'BEGIN { printf "%.4f", target - measured }')"
        safe_gain="$(awk -v ceiling="$target_tp" -v peak="$true_peak" \
            'BEGIN { printf "%.4f", ceiling - peak }')"
        use_gain="$(awk -v target="$target_gain" -v safe="$safe_gain" \
            'BEGIN { if (target < safe) printf "%.4f", target; else printf "%.4f", safe }')"

        lufs_values+=("$lufs")
        if [[ -z "$overall_safe_gain" ]] || \
            awk -v a="$safe_gain" -v b="$overall_safe_gain" 'BEGIN { exit !(a < b) }'; then
            overall_safe_gain="$safe_gain"
        fi

        printf '%9s  %7s  %8s  %8s  %11s  %9s  %9s  %s\n' \
            "$lufs" "$lra" "${sample_peak:-n/a}" "$true_peak" \
            "$(format_number "$target_gain")" \
            "$(format_number "$safe_gain")" \
            "$(format_number "$use_gain")" \
            "$rel"
    done

    echo
    if ((${#lufs_values[@]} == 0)); then
        echo "Overall: n/a (all scanned files are silent or unreadable)"
        return 0
    fi

    local -a sorted_lufs=()
    mapfile -t sorted_lufs < <(printf '%s\n' "${lufs_values[@]}" | sort -n)

    local count=${#sorted_lufs[@]}
    local median_lufs
    if ((count % 2)); then
        median_lufs="${sorted_lufs[count / 2]}"
    else
        median_lufs="$(awk -v a="${sorted_lufs[count / 2 - 1]}" -v b="${sorted_lufs[count / 2]}" \
            'BEGIN { printf "%.2f", (a + b) / 2 }')"
    fi

    local overall_loudness_gain overall_use_gain limiter="loudness target"
    overall_loudness_gain="$(awk -v target="$target_lufs" -v measured="$median_lufs" \
        'BEGIN { printf "%.4f", target - measured }')"
    overall_use_gain="$(awk -v loud="$overall_loudness_gain" -v safe="$overall_safe_gain" \
        'BEGIN { if (loud < safe) printf "%.4f", loud; else printf "%.4f", safe }')"

    if awk -v loud="$overall_loudness_gain" -v safe="$overall_safe_gain" 'BEGIN { exit !(safe < loud) }'; then
        limiter="true peak"
    fi

    echo "Median loudness       : ${median_lufs} LUFS"
    echo "Loudness target gain  : $(format_number "$overall_loudness_gain") dB  (to ${target_lufs} LUFS)"
    echo "Safe overall gain     : <= $(format_number "$overall_safe_gain") dB  (ceiling ${target_tp} dBTP)"
    echo "Recommended gain      : $(format_number "$overall_use_gain") dB  (limited by ${limiter})"
}
main() {
    local command="${1:-}"

    case "$command" in
        -h|--help|help)
            usage
            ;;
        render)
            shift
            render_command "$@"
            ;;
        volume)
            shift
            volume_command "$@"
            ;;
        "")
            usage
            exit 1
            ;;
        *)
            error "unknown command: $command (use -h for help)"
            ;;
    esac
}

main "$@"
