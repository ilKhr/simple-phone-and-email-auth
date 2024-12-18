type Contact = {
  isVerified: boolean;
  value: string | null;
};

type Contacts = {
  email: Contact;
  phone: Contact;
};

export class User {
  private id: string | null;
  private passwordHash: string;
  private contacts: Contacts = {
    email: {
      isVerified: false,
      value: null,
    },
    phone: {
      isVerified: false,
      value: null,
    },
  };

  constructor(params: {
    id: string | null;
    passwordHash: string;
    email: string | null;
    phone: string | null;
  }) {
    this.id = params.id;
    this.passwordHash = params.passwordHash;
    this.contacts.email.value = params.email;
    this.contacts.phone.value = params.phone;
  }

  private checkIsVerifiedContact(field: "email" | "phone") {
    return this.contacts[field].isVerified;
  }

  public checkIsVerifiedEmail() {
    return this.checkIsVerifiedContact("email");
  }

  public checkIsVerifiedPhone() {
    return this.checkIsVerifiedContact("phone");
  }

  private setIsVerifiedContact(field: "email" | "phone") {
    this.contacts[field].isVerified = true;
  }

  public setIsVerifiedEmail() {
    return this.setIsVerifiedContact("email");
  }

  public setIsVerifiedPhone() {
    return this.setIsVerifiedContact("phone");
  }

  getPasswordHash() {
    return this.passwordHash;
  }

  getEmail() {
    return this.contacts.email.value;
  }

  getId() {
    return this.id;
  }
  getPhone() {
    return this.contacts.email.value;
  }

  getContacts() {
    return this.contacts;
  }

  setId(id: string) {
    this.id = id;
  }
}

// мы создали модель пользователя - успех
// нам нужно начать ей оперировать
// в каком-то месте мы получаем юзера из базы и начинаем его гонять по системе
// здесь в entity я хочу обозначить основные методы, которые есть у юзера
// например проверить isVerified у email или телефона
// я бы хотел, чтобы я мог вызвать этот метод у объекта User
// для этого мне нужно возвращать объект User и у него будет как раз доступ
