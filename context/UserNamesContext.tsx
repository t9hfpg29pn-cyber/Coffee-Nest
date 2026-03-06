import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

const NAMES_KEY = "kj_userNames";

interface UserNamesContextType {
  name1: string;
  name2: string;
  user2active: boolean;
  setName1: (n: string) => Promise<void>;
  setName2: (n: string) => Promise<void>;
  removeUser2: () => Promise<void>;
}

const UserNamesContext = createContext<UserNamesContextType>({
  name1: "Hase",
  name2: "Dodo",
  user2active: true,
  setName1: async () => {},
  setName2: async () => {},
  removeUser2: async () => {},
});

export function UserNamesProvider({ children }: { children: ReactNode }) {
  const [name1, setName1State] = useState("Hase");
  const [name2, setName2State] = useState("Dodo");

  useEffect(() => {
    AsyncStorage.getItem(NAMES_KEY).then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.name1) setName1State(parsed.name1);
      if (typeof parsed.name2 === "string") setName2State(parsed.name2);
    });
  }, []);

  const persist = async (next1: string, next2: string) => {
    await AsyncStorage.setItem(NAMES_KEY, JSON.stringify({ name1: next1, name2: next2 }));
  };

  const setName1 = async (n: string) => {
    const val = n.trim() || "Hase";
    setName1State(val);
    await persist(val, name2);
  };

  const setName2 = async (n: string) => {
    const val = n.trim();
    setName2State(val);
    await persist(name1, val);
  };

  const removeUser2 = async () => {
    setName2State("");
    await persist(name1, "");
  };

  const user2active = name2.trim().length > 0;

  return (
    <UserNamesContext.Provider value={{ name1, name2, user2active, setName1, setName2, removeUser2 }}>
      {children}
    </UserNamesContext.Provider>
  );
}

export function useUserNames() {
  return useContext(UserNamesContext);
}
