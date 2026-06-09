import type { AppConfig } from "./shared/config/app-config.ts";
import { resolveOperatorRoute } from "./app/routes.ts";

export type BackofficeAppBootstrap = {
  config: AppConfig;
  route: ReturnType<typeof resolveOperatorRoute>;
};

export function bootstrapBackofficeApp(
  config: AppConfig,
  pathname: string,
): BackofficeAppBootstrap {
  return {
    config,
    route: resolveOperatorRoute(pathname),
  };
}
