import type {WidgetMessageMiddleware} from "./WidgetMessageMiddleware.tsx";
import {type DependencyList, useContext, useEffect} from "react";
import WidgetConnectorContext from "./WidgetConnectorContext.ts";
import createWidgetMessageMiddleware from "./createWidgetMessageMiddleware.ts";

export default (middleware: WidgetMessageMiddleware, deps: DependencyList): void => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetMessageMiddleware must be used within a WidgetConnector');

  const { inboundMessage$, outboundMessage$ } = context;

  useEffect(() => {
    const destroy = createWidgetMessageMiddleware(inboundMessage$, outboundMessage$, middleware);

    return () => destroy();
  }, [...deps, inboundMessage$, outboundMessage$]);
};