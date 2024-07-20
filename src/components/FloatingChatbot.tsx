"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select, { components } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface Country {
  value: string;
  label: string;
  code: string;
  country: string;
  flag: string;
}

const CustomOption = ({ children, ...props }: React.PropsWithChildren<any>) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <Image src={data.flag} alt={`${data.country} flag`} className="w-6 h-4 mr-2" width="30" height="30"/>
        <span>{data.country}</span>
        <span className="ml-auto text-gray-500">{data.code}</span>
      </div>
    </components.Option>
  );
};

const CustomSingleValue = ({ children, ...props }: React.PropsWithChildren<any>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        <Image src={data.flag} alt={`${data.country} flag`} className="w-6 h-4 mr-2"  width="30" height="30"/>
        <span>{data.country}</span>
        <span className="ml-2 text-gray-500">{data.code}</span>
      </div>
    </components.SingleValue>
  );
};

const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [authStep, setAuthStep] = useState<"country" | "phone">("country");
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCountries();
      setMessages([
        { text: "Welcome! Please select your country code:", sender: "bot" },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,flags,idd"
      );
      const data = await response.json();
      const formattedCountries = data
        .filter((country: any) => country.idd.root && country.idd.suffixes)
        .map((country: any) => ({
          value: `${country.idd.root}${country.idd.suffixes[0]}`,
          label: country.name.common,
          code: `${country.idd.root}${country.idd.suffixes[0]}`,
          country: country.name.common,
          flag: country.flags.svg,
        }))
        .sort((a: any, b: any) => a.country.localeCompare(b.country));
      setCountries(formattedCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Sorry, I couldn't load the country list. Please try again later.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const handleCountryCodeSelect = (selectedOption: Country) => {
    setSelectedCountryCode(selectedOption.code);
    setAuthStep("phone");
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: `You selected ${selectedOption.country} (${selectedOption.code}). Now, please enter your phone number without the country code:`,
        sender: "bot",
      },
    ]);
  };

  const handleSend = async () => {
    if (input.trim() || selectedCountryCode) {
      if (!isAuthenticated) {
        if (authStep === "country") {
          // This step is handled by the Select component now
          return;
        } else if (authStep === "phone") {
          const fullPhoneNumber = selectedCountryCode + input.trim();
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: fullPhoneNumber, sender: "user" },
          ]);

          if (/^\+\d{10,14}$/.test(fullPhoneNumber)) {
            setPhoneNumber(fullPhoneNumber);
            setIsAuthenticated(true);
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                text: "Thank you! You're now authenticated. How can I help you today?",
                sender: "bot",
              },
            ]);
          } else {
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                text: "Please enter a valid phone number without the country code:",
                sender: "bot",
              },
            ]);
          }
          setInput("");
          return;
        }
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, sender: "user" },
      ]);
      setInput("");
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer YOUR_OPENAI_API_KEY_HERE`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: input }],
              max_tokens: 150,
            }),
          }
        );

        const data = await response.json();
        const botReply = data.choices[0].message.content;

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply, sender: "bot" },
        ]);
      } catch (error) {
        console.error("Error:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Sorry, I couldn't process that request.", sender: "bot" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              className="fixed bottom-8 right-8 rounded-full w-16 h-16 bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-8 w-8 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 w-[450px] h-[600px] bg-white rounded-lg shadow-sm flex flex-col border"
          >
            <div className="bg-emerald-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div>
                <Image src="/iVALT.png" alt="alt" width={40} height={40} className="rounded-full"/>
              </div>
              <h3 className="font-bold">Chat with us</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedCountryCode("");
                }}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <motion.div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`max-w-xs p-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 border"
                    }`}
                  >
                    <div className="flex items-center justify-center flex-row gap-3"> 
                    { message.sender === "bot" && <Bot className="h-8 w-8" height={20} width={20} />}
                      <p> {message.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="max-w-xs p-2 rounded-lg bg-gray-200">
                    Thinking...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
            <motion.div
              className="p-4 border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {!isAuthenticated && authStep === "country" ? (
                isLoadingCountries ? (
                  <div className="w-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Select
                    options={countries}
                    onChange={handleCountryCodeSelect}
                    placeholder="Select country code"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    menuPosition="fixed"
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                  />
                )
              ) : (
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      isAuthenticated
                        ? "Type a message..."
                        : "Enter your phone number..."
                    }
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={
                      isLoading || (!isAuthenticated && authStep === "country") || input === ""
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;