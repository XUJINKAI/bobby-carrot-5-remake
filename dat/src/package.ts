export interface DatPackageParts { metadataRecord: Uint8Array; levelRecords: Uint8Array[]; }

export function splitDatPackage(bytes:Uint8Array):DatPackageParts {
  if(bytes.length<2)throw new Error('DAT package is too short'); const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const metadataLength=view.getUint16(0); const metadataEnd=2+metadataLength; if(metadataEnd>bytes.length)throw new Error('DAT metadata length exceeds package');
  const levelRecords:Uint8Array[]=[]; let offset=metadataEnd;
  while(offset<bytes.length){if(offset+2>bytes.length)throw new Error('Truncated DAT level length'); const length=view.getUint16(offset); offset+=2; if(offset+length>bytes.length)throw new Error('DAT level record exceeds package'); levelRecords.push(bytes.slice(offset,offset+length)); offset+=length;}
  return {metadataRecord:bytes.slice(2,metadataEnd),levelRecords};
}
export function joinDatPackage(parts:DatPackageParts):Uint8Array {
  if(parts.metadataRecord.length>0xffff)throw new Error('DAT metadata too large'); for(const record of parts.levelRecords)if(record.length>0xffff)throw new Error('DAT level record too large');
  const length=2+parts.metadataRecord.length+parts.levelRecords.reduce((sum,record)=>sum+2+record.length,0); const output=new Uint8Array(length); const view=new DataView(output.buffer); let offset=0;
  view.setUint16(offset,parts.metadataRecord.length);offset+=2;output.set(parts.metadataRecord,offset);offset+=parts.metadataRecord.length;
  for(const record of parts.levelRecords){view.setUint16(offset,record.length);offset+=2;output.set(record,offset);offset+=record.length;} return output;
}
export function replaceDatLevelRecord(bytes:Uint8Array,oneBasedIndex:number,replacement:Uint8Array):Uint8Array {
  const parts=splitDatPackage(bytes); const index=oneBasedIndex-1; if(!Number.isInteger(index)||index<0||index>=parts.levelRecords.length)throw new Error(`DAT level index out of range: ${oneBasedIndex}`);
  parts.levelRecords[index]=replacement; return joinDatPackage(parts);
}
