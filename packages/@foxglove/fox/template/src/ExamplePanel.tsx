// persisted panel state
type Config = {
  storedValue?: number;
};

type Props = {
  config: Config;
  saveConfig: (config: Config) => void;
};

export function ExamplePanel(props: Props): JSX.Element {
  return <div>Stored value is: {props.config.storedValue}</div>;
}
