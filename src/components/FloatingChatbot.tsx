"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { components } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import CountrySelector from "./CountrySelector";

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

interface ChatbotState {
  isAuthenticated: boolean;
  phoneNumber: string;
  selectedCountryCode: string;
  authStep: "country" | "phone";
  messages: Message[];
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
  const [authenticationStatus, setAuthenticationStatus] = useState<"idle" | "requesting" | "polling" | "authenticated" | "failed">("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load state from localStorage
    const savedState = localStorage.getItem('chatbotState');
    if (savedState) {
      const parsedState: ChatbotState = JSON.parse(savedState);
      setIsAuthenticated(parsedState.isAuthenticated);
      setPhoneNumber(parsedState.phoneNumber);
      setSelectedCountryCode(parsedState.selectedCountryCode);
      setAuthStep(parsedState.authStep);
      setMessages(parsedState.messages);
    }

    if (isOpen) {
      fetchCountries();
      if (messages.length === 0) {
        setMessages([
          { text: "Welcome! Please select your country code:", sender: "bot" },
        ]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
    // Save state to localStorage
    const stateToSave: ChatbotState = {
      isAuthenticated,
      phoneNumber,
      selectedCountryCode,
      authStep,
      messages,
    };
    localStorage.setItem('chatbotState', JSON.stringify(stateToSave));
  }, [messages, isAuthenticated, phoneNumber, selectedCountryCode, authStep]);

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
            await initiateAuthentication(fullPhoneNumber);
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
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

  const initiateAuthentication = async (phoneNumber: string) => {
    setAuthenticationStatus("requesting");
    try {
      const response = await fetch("https://api.ivalt.com/biometric-auth-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'x-api-key': `Dga3IZIAEm2pp5VckTwdt3N1EH6KcCLJ2v5UQ2X3`,
        },
        body: JSON.stringify({ mobile: phoneNumber, requestFrom: 'iVALT AI Chatbot' }),
      });

      if (response.ok) {
        setAuthenticationStatus("polling");
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Biometric authentication request sent. Please check your iValt app and complete the authentication.", sender: "bot" },
        ]);
        pollAuthenticationStatus(phoneNumber);
      } else {
        throw new Error("Failed to initiate authentication");
      }
    } catch (error) {
      console.error("Error initiating authentication:", error);
      setAuthenticationStatus("failed");
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Sorry, we couldn't initiate the authentication process. Please try again later.", sender: "bot" },
      ]);
    }
  };

  const pollAuthenticationStatus = async (phoneNumber: string) => {
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes (150 * 2 seconds)

    const pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        setAuthenticationStatus("failed");
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Authentication timed out. Please try again.", sender: "bot" },
        ]);
        return;
      }

      try {
        const response = await fetch("https://api.ivalt.com/biometric-auth-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'x-api-key': `Dga3IZIAEm2pp5VckTwdt3N1EH6KcCLJ2v5UQ2X3`,
          },
          body: JSON.stringify({ mobile: phoneNumber, requestFrom: 'iVALT AI Chatbot' }),
        });
        console.log(response)
        if (response.status === 200) {
          const data = await response.json();
          clearInterval(pollInterval);
          setAuthenticationStatus("authenticated");
          setIsAuthenticated(true);
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: `Authentication successful!           \n\n Hi, ${data?.data?.details?.name} How can I help you today?`, sender: "bot" },
          ]);
        } else if (response.status === 422) {
          // Continue polling
        } else if (response.status === 404) {
          clearInterval(pollInterval);
          setAuthenticationStatus("failed");
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "User not found. Please check your phone number and try again.", sender: "bot" },
          ]);
        } else if (response.status === 403) {
          clearInterval(pollInterval);
          setAuthenticationStatus("failed");
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Authentication failed. Please try again.", sender: "bot" },
          ]);
        }
      } catch (error) {
        console.error("Error polling authentication status:", error);
        clearInterval(pollInterval);
        setAuthenticationStatus("failed");
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Sorry, we encountered an error while checking your authentication status. Please try again later.", sender: "bot" },
        ]);
      }
    }, 4000);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpen && (
          <div>
            <Button
              className="fixed bottom-12 right-12 rounded-full w-16 h-16 bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-8 w-8 text-white" />
            </Button>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed m-4 lg:bottom-8 lg:right-8 w-[420px] h-[500px] bg-white rounded-lg shadow-sm flex flex-col"
          >
            <ChatHeader onClose={() => {
              setIsOpen(false);
              setSelectedCountryCode("");
            }} />
            <ChatMessages 
              messages={messages}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
            {!isAuthenticated && authStep === "country" ? (
              <CountrySelector 
                isLoadingCountries={isLoadingCountries}
                countries={countries}
                handleCountryCodeSelect={handleCountryCodeSelect}
              />
            ) : (
              <ChatInput 
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                isLoading={isLoading}
                isAuthenticated={isAuthenticated}
                authStep={authStep}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;