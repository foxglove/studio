// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect, useState } from "react";
import Bag from "rosbag";

import Logger from "@foxglove/log";

const log = Logger.getLogger(__filename);

type InfoEntry = { topic: string; datatype: string; numMessages: number };
async function load(file: File): Promise<InfoEntry[]> {
  const bag = await Bag.open(file);
  //log("Chunk info:  ",JSON.stringify(bag.chunkInfos, undefined, 2));
  //log("Connections: ",JSON.stringify(bag.connections, undefined, 2));
  /*
        path:        /home/ubuntu/testbags/markers.bag
        version:     2.0
        duration:    3.0s
        start:       May 03 2021 18:57:58.49 (1620068278.49)
        end:         May 03 2021 18:58:01.50 (1620068281.50)
        size:        15.1 KB
        messages:    10
        compression: none [1/1 chunks]
        types:       visualization_msgs/MarkerArray [d155b9ce5188fbaf89745847fd5882d7]
        topics:      /example_markers   10 msgs    : visualization_msgs/MarkerArray
        */
  const numMessagesByConnectionIndex = Array.from(bag.connections.values(), () => 0);
  for (const chunk of bag.chunkInfos) {
    for (const { conn, count } of chunk.connections) {
      numMessagesByConnectionIndex[conn] += count;
    }
  }

  const conns = [...bag.connections.values()].sort((a, b) => a.topic.localeCompare(b.topic));
  const outputs: InfoEntry[] = [];
  for (const { topic, type: datatype, conn } of conns) {
    outputs.push({
      topic,
      datatype: datatype ?? "(unknown)",
      numMessages: numMessagesByConnectionIndex[conn] ?? 0,
    });
  }
  return outputs;
}
export default function Root(): JSX.Element {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [infos, setInfos] = useState<InfoEntry[]>([]);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (file) {
      load(file)
        .then((newInfos) => setInfos(newInfos))
        .catch((err) => {
          log.error("Error opening bag", err);
          setError(`Error opening bag: ${err}`);
        });
    }
  }, [file]);

  useEffect(() => {
    setError("starting");
    quicklook
      .getPreviewedFile()
      .then((f) => {
        setError(`Got response! ${f}`);
        setFile(f);
        quicklook.finishedLoading();
      })
      .catch((err) => {
        log.error("Unable to get previewed file", err);
        setError(`Unable to get previewed file: ${err}`);
      });
  }, []);

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer?.files[0]) {
        setFile(event.dataTransfer.files[0]);
      }
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return (
    <div>
      {error}
      <input
        type="file"
        onChange={(event) => {
          if (event.target.files?.[0]) {
            setFile(event.target.files[0]);
          }
        }}
      />
      <table>
        <tbody>
          <tr>
            <th>Topic</th>
            <th>Datatype</th>
            <th>Messages</th>
          </tr>
          {infos.map(({ topic, datatype, numMessages }, i) => (
            <tr key={i}>
              <td>{topic}</td>
              <td>{datatype}</td>
              <td>{numMessages}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// webkit.messageHandlers.quicklook
//   .postMessage({ action: "click", x: window.innerWidth / 2, y: window.innerHeight / 2 })
//   .catch((err) => {
//     log.error("Couldn't click", err);
//   });
