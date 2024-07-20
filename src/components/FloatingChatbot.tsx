"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface Country {
  code: string;
  country: string;
  flag: string;
}

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

  const handleCountryCodeSelect = (value: string) => {
    setSelectedCountryCode(value);
    setAuthStep("phone");
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: `You selected ${value}. Now, please enter your phone number without the country code:`,
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
              className="fixed bottom-4 right-4 rounded-full w-16 h-16 bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg"
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
            className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-lg shadow-xl flex flex-col"
          >
            <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold">Chat with us</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
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
                        : "bg-gray-200"
                    }`}
                  >
                    {message.text}
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
                  <Select onValueChange={handleCountryCodeSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code} className="py-3">
                          <div className="flex items-center">
                            <Image
                              src={country.flag}
                              alt={`${country.country} flag`}
                              className="w-5 h-5 mr-2"
                              width={20}
                              height={20}
                            />
                            {country.country} ({country.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      isLoading || (!isAuthenticated && authStep === "country")
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
