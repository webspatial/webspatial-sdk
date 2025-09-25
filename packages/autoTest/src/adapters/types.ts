// src/adapters/types.ts

/**
 * 命令执行结果接口
 */
export interface CommandResult {
  success: boolean;
  data: any;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * WebSpatial协议结果接口
 */
export interface WebSpatialProtocolResult {
  success: boolean;
  data: {
    windowProxy: WindowProxy;
    id: string;
  };
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 平台能力接口
 * 模拟CoreSDK中的PlatformAbility接口
 */
export interface PlatformAbility {
  callJSB(cmd: string, msg: string): Promise<CommandResult>;
  callWebSpatialProtocol(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
  ): Promise<WebSpatialProtocolResult>;

  callWebSpatialProtocolSync(
    schema: string,
    query?: string,
    target?: string,
    features?: string,
    resultCallback?: (result: CommandResult) => void,
  ): WebSpatialProtocolResult;
}