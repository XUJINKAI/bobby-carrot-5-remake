import { enterBehavior } from "../../mechanics/behaviors.js";
import type { DefinitionRegistrationPorts } from "../../mechanics/definition/registration.js";
import { CustomObjectId } from "../../mechanics/ids.js";

export function registerPortal(ports: DefinitionRegistrationPorts): void {
  ports.defineObject(
    CustomObjectId.PORTAL,
    "custom-mechanic",
    [],
    [
      enterBehavior("portal", "进入后传送到相同频道的另一端", (context) => {
        if (context.mode !== "normal") return;
        const destination = context.api.relocateToMatchingObject(
          CustomObjectId.PORTAL,
          "channel",
        );
        if (destination)
          context.api.objectInteraction(
            CustomObjectId.PORTAL,
            "teleport",
            "通过 Portal",
            destination,
          );
      }),
    ],
  );
  ports.setObject({
    ...ports.getObject(CustomObjectId.PORTAL),
    authoring: {
      palette: true,
      properties: [
        {
          key: "channel",
          kind: "enum",
          label: "频道",
          options: [
            { value: "blue", label: "蓝色" },
            { value: "red", label: "红色" },
            { value: "green", label: "绿色" },
          ],
        },
      ],
    },
  });
}
