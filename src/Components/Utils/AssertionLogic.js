import { ASSERTION_LOGIC } from "../../Constants/Commons";

export const checkAnswer = (logic, response, quiz) => {
  if (logic === ASSERTION_LOGIC.CTA) {
    for (let i = 0; i < quiz.answer.length; i++) {
      if (quiz.answer[i].toLowerCase() === response.toLowerCase()) return true;
    }
  }
  if (logic === ASSERTION_LOGIC.CTH) {
    quiz.hints.map((hint) => {
      if (hint.toLowerCase() === response.toLowerCase()) return true;
    });
  }
  if (logic === ASSERTION_LOGIC.CTQ) {
    if (quiz.question.toLowerCase() === response.toLowerCase()) return true;
  }
  return false;
};
