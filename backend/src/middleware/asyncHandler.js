// Express 4 не ловит отклонённые промисы из async-роутов сам — без этой
// обёртки ошибка в async-хендлере повиснет запрос вместо ответа с 500.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
