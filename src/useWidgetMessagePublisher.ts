import {useCallback, useContext} from "react";
import WidgetConnectorContext from "./WidgetConnectorContext.ts";
import type {OutboundWidgetMessage} from "./OutboundWidgetMessage.tsx";

type PublishWidgetMessage = (outboundMessage: OutboundWidgetMessage) => void;

export default (): PublishWidgetMessage => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetMessagePublisher must be used within a WidgetConnector');

  const { outboundMessage$ } = context;

  return useCallback((outboundMessage: OutboundWidgetMessage) => outboundMessage$.next(outboundMessage), [outboundMessage$]);
};