import { Button, Dialog, Divider, IconButton, Input, Typography } from "@mui/material";
import Stack from "@foxglove/studio-base/components/Stack";
import CloseIcon from "@mui/icons-material/Close";
import { makeStyles } from "tss-react/mui";
import { fromSec, Time, toSec } from "@foxglove/rostime";
import { isDownloadStopped, recordVideo } from "@foxglove/studio-base/panels/video/downloadVideo";
import { subtractTimes } from "@foxglove/studio-base/players/UserNodePlayer/nodeTransformerWorker/typescript/userUtils/time";
import { useEffect, useState } from "react";
import { Player } from "@foxglove/studio-base/players/types";

const useStyles = makeStyles()((theme) => ({
  grid: {
    alignItems: "center",
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: theme.spacing(1),
    overflow: "auto",
    alignContent: "flex-start",
  },
  paper: {
    maxWidth: `calc(min(${theme.breakpoints.values.md}px, 100% - ${theme.spacing(4)}))`,
    padding: "48px",
  },
  button: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    height: "50px",
    background: "#6f3be8",
    color: "fff"
  },
  input: {
    width: "250px",
    height: "50px",
    border: "2px solid #6f3be8",
  },
  closeButton: {
    marginBottom: "7px",
  },
}));

export type VideoProps = {
  stop: NonNullable<Player["pausePlayback"]>,
  start: NonNullable<Player["startPlayback"]>,
  seek: NonNullable<Player["seekPlayback"]>,
  startTime: Time,
  endTime: Time,
  play: () => void
}
export type DownloadVideoModalProps = {
  setPlayingTime: (time: number) => void;
  canvas: HTMLCanvasElement | ReactNull | undefined;
  videoProps: VideoProps;
  setDownloadStarted: (data: boolean) => void;
  setIsDownloadPressed: (data: boolean) => void;
};

export function DownloadModal(props: DownloadVideoModalProps): JSX.Element {
  const { setPlayingTime, canvas, videoProps, setDownloadStarted, setIsDownloadPressed } = props;
  const { classes } = useStyles();
  const [fromRecordTime, setFromRecordTime] = useState<String>();
  const [toRecordTime, setToRecordTime] = useState<String>();
  const [videoName, setVideoMame] = useState<string>('video');

  useEffect(() => {
    if (isDownloadStopped) {
      setDownloadStarted(false);
      videoProps.stop();
    }
  }, [isDownloadStopped]);

  const downloadFullVideo = () => {
    playVideoAndDownload(false);
  };

  const downloadVideoFromRange = () => {
    seekVideo();
  };

  const seekVideo = () => {
    setPlayingTime(videoProps.startTime?.sec + Number(toRecordTime));
    videoProps.seek(fromSec(videoProps.startTime?.sec + Number(fromRecordTime)));
    playVideoAndDownload(true);
  };

  const playVideoAndDownload = (fromRange = false) => {
    if (!fromRange) {
      videoProps.seek(fromSec(videoProps.startTime?.sec));
      setPlayingTime(videoProps.endTime?.sec)
    }
    videoProps.play();
    recordVideo(canvas, videoName,fromRange ? undefined : toSec(subtractTimes(videoProps.endTime as Time, videoProps.startTime)) );
    setDownloadStarted(true);
    setIsDownloadPressed(false);
  };
  return (
    <Dialog
      open
      onClose={() => setIsDownloadPressed(false)}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        square: false,
        elevation: 4,
        className: classes.paper,
      }}
    >
      <Stack direction="row" justifyContent="space-between" style={{ marginBottom: 32 }}>
        <Typography variant="h1" color="primary" gutterBottom>Choose download option</Typography>
        <IconButton
          className={classes.closeButton}
          onClick={() => setIsDownloadPressed(false)}
          edge="end">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider />
      <Stack justifyContent="space-between" style={{ marginBottom: 16, marginTop: 16  }}>
        <Typography variant="h5" gutterBottom>Enter video name</Typography>
        <Input
          className={classes.input}
          autoFocus={fromRecordTime === ""}
          disableUnderline={true}
          placeholder="Enter video name"
          onClick={(e) => e.stopPropagation()}
          onChange={(event) => setVideoMame(event.target.value)}
        />
      </Stack>
      <Divider />
      <Stack
        direction="row"
        justifyContent="space-between"
        gap={4}
        style={{ marginBottom: 16, marginTop: 16 }}
      >
        <Typography variant="h5" gutterBottom>Download full video</Typography>
        <Button
          size="large"
          onClick={downloadFullVideo}
          className={classes.button}
          variant="contained"
        >
          Download
        </Button>
      </Stack>
      <Divider> <Typography variant="h5"> Or </Typography> </Divider>

      <Typography variant="h5" gutterBottom style={{ marginBottom: 16, marginTop: 16 }}>Download a specific video interval</Typography>

      <Stack direction="row"
             justifyContent="space-between"
             gap={4}>
        <Input
          className={classes.input}
          autoFocus={fromRecordTime === ""}
          disableUnderline={true}
          placeholder="Start video record in seconds"
          onClick={(e) => e.stopPropagation()}
          onChange={(event) => setFromRecordTime(event.target.value)}
        />
        <Input
          className={classes.input}
          disableUnderline={true}
          autoFocus={toRecordTime === ""}
          placeholder="End video record time"
          onClick={(e) => e.stopPropagation()}
          onChange={(event) => setToRecordTime(event.target.value)}
        />
        <Button
          size="large"
          onClick={downloadVideoFromRange}
          className={classes.button}
          variant="contained"
        >
          Download
        </Button>
      </Stack>
    </Dialog>
  );
}