import { markerBehavior } from "../../mechanics/behaviors.js";
import type { DefinitionRegistrationPorts } from "../../mechanics/definition/registration.js";
import { CustomObjectId } from "../../mechanics/ids.js";

export function registerPortal(ports: DefinitionRegistrationPorts): void {
  ports.defineObject(
    CustomObjectId.PORTAL,
    "custom-mechanic",
    [],
    [markerBehavior("portal", "进入后传送到相同频道的另一端")],
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
