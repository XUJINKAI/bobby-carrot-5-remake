/**
 * 稳定 Definition façade：先加载原版定义，再注册扩展定义。
 * 具体 Terrain/Object 定义分别位于 `original/` 与 `custom/`。
 */
import { registerCustomDefinitions } from "../custom/register.js";
import { definitionRegistrationPorts } from "../original/definitions.js";

registerCustomDefinitions(definitionRegistrationPorts);

export * from "../original/definitions.js";
