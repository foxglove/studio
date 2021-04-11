# rosmsg-deser

Deserialize ArrayBuffers using [ROS Message serialization format](http://wiki.ros.org/msg).

## LazyMessage

Lazy messages provide on-demand access and deserialization to fields of a serialized ROS message. Creating
a lazy message from a buffer performs no de-serialization during creation. Only accessed fields are
deserialized. Deserialization occurs at access time.

```Typescript
import { LazyMessageReader } from "@foxglove/rosmsg-deser";

// message definition comes from rosbag.js
const reader = new LazyMessageReader(messageDefinition);

// build a new lazy message instance for our serialized message from the Uint8Array
// Note: the array lifetime should be as long as the message lifetime
const message = reader.readMessage([0x00, 0x00, ...]);

// access message fields
message.header.stamp;
```
