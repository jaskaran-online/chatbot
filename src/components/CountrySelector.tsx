import React from 'react';
import Select from 'react-select';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { CustomOption, CustomSingleValue } from './CustomSelectComponents';

interface Country {
  value: string;
  label: string;
  code: string;
  country: string;
  flag: string;
}

interface CountrySelectorProps {
  isLoadingCountries: boolean;
  countries: Country[];
  handleCountryCodeSelect: (selectedOption: Country) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  isLoadingCountries,
  countries,
  handleCountryCodeSelect
}) => (
  <motion.div
    className="p-4 border-t"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    {isLoadingCountries ? (
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
    )}
  </motion.div>
);

export default CountrySelector;
