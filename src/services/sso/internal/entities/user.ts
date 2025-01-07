import { IdRequired } from "src/utils/types";

type Contact = {
  isVerified: boolean;
  value: string | null;
};

type Contacts = {
  email: Contact;
  phone: Contact;
};

export type UserWithId = IdRequired<User>;

export type UserParams = {
  id: number | null;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

type UserStruct = {
  id: number | null;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  contacts: Contacts;
};

const checkIsVerifiedContact = (user: UserStruct, field: "email" | "phone") => {
  return user.contacts[field].isVerified;
};

const setIsVerifiedContact = (user: UserStruct, field: "email" | "phone") => {
  user.contacts[field].isVerified = true;
};

const setId = (user: UserStruct, id: number) => (user.id = id);

const getPasswordHash = (user: UserStruct) => user.passwordHash;

const getEmail = (user: UserStruct) => user.contacts.email.value;

const getPhone = (user: UserStruct) => user.contacts.phone.value;

const getId = (user: UserStruct) => user.id;

const getFirstName = (user: UserStruct) => user.firstName;

const getLastName = (user: UserStruct) => user.lastName;

const getContacts = (user: UserStruct) => user.contacts;

export const UserCreate = (params: UserParams) => {
  const user: UserStruct = {
    id: params.id,
    passwordHash: params.passwordHash,
    firstName: params.firstName,
    lastName: params.lastName,
    contacts: {
      email: {
        isVerified: false,
        value: params.email,
      },
      phone: {
        isVerified: false,
        value: params.phone,
      },
    },
  };

  return {
    checkIsVerifiedEmail: () => checkIsVerifiedContact(user, "email"),
    checkIsVerifiedPhone: () => checkIsVerifiedContact(user, "phone"),
    setIsVerifiedEmail: () => setIsVerifiedContact(user, "email"),
    setIsVerifiedPhone: () => setIsVerifiedContact(user, "phone"),
    getPasswordHash: () => getPasswordHash(user),
    getEmail: () => getEmail(user),
    getId: () => getId(user),
    getFirstName: () => getFirstName(user),
    getLastName: () => getLastName(user),
    getPhone: () => getPhone(user),
    getContacts: () => getContacts(user),
    setId: (id: number) => setId(user, id),
  };
};

export type User = ReturnType<typeof UserCreate>;
