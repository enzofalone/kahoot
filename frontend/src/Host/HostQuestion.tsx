import { useCountdown } from '@/hooks/useCountdown';
import { useGameStore } from '@/lib/store';
import { useWebSocketContext } from '@/lib/websocket';
import { EventType } from '@/util/event';
import { useEffect, useState } from 'react';

const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-400'];

function HostQuestion() {
  const { emitter } = useWebSocketContext();
  const { countdown, startCountdown } = useCountdown();
  const [correctAnswer, setCorrectAnswer] = useState<string>();
  const [answerDistribution, setAnswerDistribution] =
    useState<Record<string, number>>();
  const [answers, setAnswers] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);

  const prompt = useGameStore((state) => state.prompt);
  const setPrompt = useGameStore((state) => state.setPrompt);

  const answerBank = useGameStore((state) => state.answerBank);
  const setAnswerBank = useGameStore((state) => state.setAnswerBank);

  const clearQuestion = useGameStore((state) => state.clearQuestion);

  useEffect(() => {
    emitter.on(EventType.QUESTION, (e) => {
      startCountdown(e.sleep / 1000);
      setPrompt(e.prompt);
      setAnswerBank(e.answerBank);
    });

    emitter.on(EventType.ANSWER, () => {
      setAnswers((a) => a + 1);
    });

    emitter.on(EventType.REVEAL, (e) => {
      setCorrectAnswer(e.correctAnswer);
      setAnswerDistribution(e.answerDistribution);
    });

    emitter.on(EventType.ALL_ANSWERED, (e) => {
      startCountdown(e.sleep / 1000);
      setAllAnswered(true);
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
        {!correctAnswer ? (
          <QuestionScreen
            answers={answers}
            countdown={countdown}
            allAnswered={allAnswered}
          />
        ) : (
          <ResultScreen
            answerBank={answerBank}
            answerDistribution={answerDistribution ?? {}}
            correctAnswer={correctAnswer}
          />
        )}
        <div className="w-full grid grid-cols-2 gap-3 max-h-[30vh] max-w-[1280px] mx-auto">
          {answerBank.map((answer: string, i: number) => (
            <AnswerButton
              key={i}
              color={colors[i]}
              answer={answer}
              correct={answer === correctAnswer}
              answerRevealed={correctAnswer != undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function QuestionScreen({
  allAnswered,
  countdown,
  answers,
}: {
  allAnswered: boolean;
  countdown: number;
  answers: number;
}) {
  return (
    <div className="grid grid-cols-4 h-[40vh] mb-6">
      <div className="w-[12rem] h-[12rem] m-auto">
        <div
          className={`w-full h-full rounded-full ${
            allAnswered ? 'bg-green-400' : 'bg-purple-400'
          } flex justify-center items-center col-span-1`}
        >
          <span className="font-bold italic text-6xl">{countdown || 0}</span>
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
  );
}

function ResultScreen({
  answerBank,
  answerDistribution,
  correctAnswer,
}: {
  answerBank: string[];
  answerDistribution: Record<string, number>;
  correctAnswer: string;
}) {
  return (
    <div className="w-full flex justify-center gap-2 h-[40vh]">
      <div className="flex flex-row gap-3">
        {answerBank.map((answer, i) => (
          <div
            key={i}
            className={`${colors[i]} text-slate-50 text-4xl p-4 ${
              correctAnswer === answer ? 'brightness-400' : ''
            }`}
          >
            {correctAnswer === answer ? '(Correct)' : ''}
            {answer}: {answerDistribution[answer] ?? 0}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerButton({
  color,
  answer,
  correct,
  answerRevealed,
}: {
  color: string;
  answer: string;
  correct: boolean | undefined;
  answerRevealed: boolean;
}) {
  return (
    <div
      className={`flex align-center ${color} ${
        answerRevealed && correct === false ? 'brightness-200' : ''
      }`}
    >
      <span className={`text-slate-50 text-4xl tracking-wide p-15`}>
        {answer}
      </span>
    </div>
  );
}

export default HostQuestion;
