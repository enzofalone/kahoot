import { useEffect, useState } from 'react';
import { EventType } from '../util/event';
import { useWebSocketContext } from '../lib/websocket';
import { useGameStore } from '../lib/store';
import { LoadingBar } from '@/components/Loading/LoadingBar';

const UNDEFINED_PROMPT = 'Undefined Prompt';

const HostPrompt = () => {
  const { emitter } = useWebSocketContext();

  const prompt = useGameStore((state) => state.prompt);
  const setPrompt = useGameStore((state) => state.setPrompt);
  const questionIndex = useGameStore((state) => state.questionIndex);
  const incrementQuestionIndex = useGameStore(
    (state) => state.incrementQuestionIndex
  );
  const totalQuestions = useGameStore((state) => state.totalQuestions);

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    emitter.on(EventType.PROMPT, (e) => {
      setPrompt(e.prompt || UNDEFINED_PROMPT);
      setDuration(e.sleep);
    });

    incrementQuestionIndex();
  }, []);

  return (
    <>
      {duration > 0 ? <LoadingBar duration={duration} /> : <></>}
      <div className="flex flex-col justify-center w-full items-center text-2xl p-15">
        <div>
          <h2>
            Question {questionIndex} of {totalQuestions || 404}
          </h2>
        </div>
        <div>
          <h1 className="text-4xl">{prompt || 'Undefined'}</h1>
        </div>
      </div>
    </>
  );
};

export default HostPrompt;
