// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Transform, TransformCallback } from "stream";

export class TcpMessageStream extends Transform {
  private _inMessage = false;
  private _bytesNeeded = 4;
  private _chunks: Uint8Array[] = [];

  _transform(chunk: Uint8Array, _encoding: BufferEncoding, callback: TransformCallback): void {
    let idx = 0;
    while (idx < chunk.length) {
      if (chunk.length - idx < this._bytesNeeded) {
        // If we didn't receive enough bytes to complete the current message or
        // message length field, store this chunk and continue on
        this._chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset + idx));
        this._bytesNeeded -= chunk.length - idx;
        return callback();
      }

      // Store the final chunk needed to complete the current message or message
      // length field
      this._chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset + idx, this._bytesNeeded));
      idx += this._bytesNeeded;

      const payload = TcpMessageStream.ConcatData(this._chunks);

      if (this._inMessage) {
        // Produce a Uint8Array representing a single message and transition to
        // reading a message length field
        this._bytesNeeded = 4;
        this.emit("message", payload);
      } else {
        // Decoded the message length field and transition to reading a message
        this._bytesNeeded = new DataView(payload.buffer).getUint32(0, true);
      }

      this._inMessage = !this._inMessage;
      this._chunks = [];
    }

    callback();
  }

  static ConcatData(chunks: Uint8Array[]): Uint8Array {
    if (chunks.length === 1) {
      return chunks[0];
    }

    const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
    if (totalLength === 0) {
      return new Uint8Array();
    }

    const result = new Uint8Array(totalLength);
    let idx = 0;
    chunks.forEach((chunk) => {
      result.set(chunk, idx);
      idx += chunk.length;
    });
    return result;
  }
}
