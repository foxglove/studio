import { TextDecoder as UtilTextDecoder } from "util";

// bobjects assume text decoder is available and punts to the user to provide it
global.TextDecoder = UtilTextDecoder as typeof TextDecoder;
