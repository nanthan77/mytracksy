import { Composition } from "remotion";
import { DoctorDemo } from "./DoctorDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DoctorDemo"
        component={DoctorDemo}
        durationInFrames={30 * 75} // 75 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
