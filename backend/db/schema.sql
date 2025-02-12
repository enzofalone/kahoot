CREATE TABLE bank (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL
);

CREATE TABLE question (
    id SERIAL PRIMARY KEY, 
    bank_id	INTEGER,
    prompt TEXT NOT NULL,
    answer_bank TEXT,
    next_question INTEGER,
    FOREIGN KEY (bank_id) REFERENCES bank(id) ON DELETE CASCADE,
    FOREIGN KEY (next_question) REFERENCES question(id)
);