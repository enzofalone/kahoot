import { NavLink } from "react-router";

type Props = {};

function App({}: Props) {
  return (
    <div>
      <p>Start as</p>
      <NavLink to={"/host"}>Host</NavLink>
      <NavLink to={"/lobby"}>Player</NavLink>
    </div>
  );
}

export default App;
