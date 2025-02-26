import HostLobby from './Host/HostLobby';
import HostPrompt from './Host/HostPrompt';
import HostQuestion from './Host/HostQuestion';
import { HostContextProvider, useHostContext } from './lib/host';
import Loading from './components/Loading/Loading';
import { EventType } from './util/event';

function Host() {
  return (
    <HostContextProvider>
      <Loading />
      <HostStateManager />
    </HostContextProvider>
  );
}

function HostStateManager() {
  const { state } = useHostContext();

  switch (state) {
    case EventType.PROMPT:
      return <HostPrompt />;
    case EventType.QUESTION:
      return <HostQuestion />;
    default:
      return <HostLobby />;
  }
}

export default Host;
