# SSO

Simple sso service with TS Classes and SOLID

# TODO:

Валидации

- [ ] пароля при регистрации
- [ ] email при регистрации
- [ ] phone при регистрации
      SSO
- JWT
- [x] Определить данные для JWT
- [x] Изменить сессии для поддержки JWT
- Logout
- [ ] Написать Logout эндпоинт для отзыва

# Thinks

Я в SSO создаю сессию с пометкой какое это приложение, с какого устройства вход и IP
При этом само SSO приложение также работает на JWT, чтобы поддержать однообразие во всех приложениях в работе с авторизацией

Отзыв токенов будет реализован следующим образом: каждое приложение будет хранить локальную таблицу black_list_token, где будет указано какие токены отзываются и когда они истекают (мы ведь знаем, когда истекает токен?)
Если токен истёк, то мы удаляем запись из black_list_token, потому что от неё нет смысла,
