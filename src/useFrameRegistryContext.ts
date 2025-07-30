import {useContext} from "react";
import FrameRegistryContext from "./FrameRegistryContext";

const useFrameRegistryContext = () => {
  const context = useContext(FrameRegistryContext);
  if (!context)
    throw new Error('useFrameRegistryContext must be used within a FrameRegistryProvider');

  return context;
};

export default useFrameRegistryContext;