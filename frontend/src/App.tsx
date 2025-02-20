import { NavLink } from 'react-router';

type Props = {};

function App({}: Props) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="w-fit flex justify-center flex-col items-center">
        <div className="flex mb-5">
          <h1 className="text-5xl">fake kahoot</h1>
        </div>
        <p>Start as</p>
        <div className="">
          <NavLink to={'/host'}>Host</NavLink>
          <NavLink to={'/lobby'}>Player</NavLink>
        </div>
      </div>
    </div>
  );
}

export default App;
