import { useCountdown } from '@/hooks/useCountdown';
import { useGameStore } from '@/lib/store';
import { useWebSocketContext } from '@/lib/websocket';
import { EventType } from '@/util/event';
import { useEffect, useState } from 'react';

function HostQuestion() {
  const { emitter } = useWebSocketContext();
  const { countdown, startCountdown } = useCountdown();

  const prompt = useGameStore((state) => state.prompt);
  const setPrompt = useGameStore((state) => state.setPrompt);

  const answerBank = useGameStore((state) => state.answerBank);
  const setAnswerBank = useGameStore((state) => state.setAnswerBank);

  const incrementAnswers = useGameStore((state) => state.incrementAnswers);
  const answers = useGameStore((state) => state.answers);

  const clearQuestion = useGameStore((state) => state.clearQuestion);

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-400'];

  useEffect(() => {
    emitter.on(EventType.QUESTION, (e) => {
      startCountdown(countdown / 1000);
      setPrompt(e.prompt);
      setAnswerBank(e.answerBank);
    });

    emitter.on(EventType.ANSWER, () => {
      incrementAnswers();
    });

    return () => {
      clearQuestion();
    };
  }, [emitter]);

  return (
    <>
      <div className="p-5">
        <div className="flex justify-center py-5">
          <span className="text-5xl font-bold">{prompt || 'Prompt?'}</span>
        </div>
        <div className="grid grid-cols-4 h-[40vh] mb-6">
          <div className="w-[12rem] h-[12rem] m-auto">
            <div className="w-full h-full rounded-full bg-purple-400 flex justify-center items-center col-span-1">
              <span className="font-bold italic text-6xl">
                {countdown || 0}
              </span>
            </div>
          </div>
          <div className="w-full h-full mb-5 bg-blue-400 flex justify-center items-center col-span-2">
            <span>{'work in progress :('}</span> {/* Add image field */}
          </div>
          <div className="m-auto flex flex-col justify-center">
            <span className="italic font-bold text-center text-6xl">
              {answers || 0}
            </span>
            <span className="font-bold text-3xl ">Answers</span>
          </div>
        </div>
        <div className="w-full grid grid-cols-2 gap-3 max-h-[30vh] max-w-[1280px] mx-auto">
          {answerBank.map((answer: string, i: number) => (
            <AnswerButton key={i} color={colors[i]} answer={answer} />
          ))}
        </div>
      </div>
    </>
  );
}

function AnswerButton({ color, answer }: { color: string; answer: string }) {
  return (
    <div className={`flex align-center bg-greeen-500 ${color}`}>
      <span className="text-slate-50 font-bold text-4xl tracking-wide p-15">
        {answer}
      </span>
    </div>
  );
}

export default HostQuestion;
