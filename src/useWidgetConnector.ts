import {useContext} from "react";
import WidgetConnectorContext from "./WidgetConnectorContext.ts";

export default () => {
  const context = useContext(WidgetConnectorContext);
  if (!context)
    throw new Error('useWidgetConnector must be used within a WidgetConnector');

  return context.connect;
}