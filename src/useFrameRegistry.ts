import {useContext} from "react";
import FrameRegistryContext from "./FrameRegistryContext";

const useFrameRegistry = () => {
  const context = useContext(FrameRegistryContext);
  if (!context)
    throw new Error('useFrameRegistry must be used within a FrameRegistryProvider');

  return context;
};

export default useFrameRegistry;