import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import propertiesData from '../../properties_data.json';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';

const PropertyList = ({ onSelect, value = '' }) => {
  const { t, i18n } = useTranslation();
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [input, setInput] = useState('');
  const containerRef = useRef(null);
  

  console.log('Current language:', i18n.language);

  useEffect(() => {
    if (value !== input) {
      setInput(value);
    }
  }, [value]);
  

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setFilteredProperties([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Debounced function to filter properties from JSON data
  const handleInputChange = debounce((value) => {
    if (value.trim()) {
      const matches = propertiesData.filter((property) =>
        property["Property Name"].toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProperties(matches);
    } else {
      setFilteredProperties([]);
    }
  }, 500);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    handleInputChange(value); // Trigger debounced function
  };

  const handleSelect = (property) => {
    onSelect(property);
    setInput(property["Property Name"]);
    setFilteredProperties([]);
  };

  return (
    <Container ref={containerRef}>
      <Input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder={t("Search for a property...")}
      />
      {filteredProperties.length > 0 && (
        <Suggestions>
          {filteredProperties.map((property, index) => (
            <SuggestionItem
              key={index} // Assuming no unique id, use index as a key
              onClick={() => handleSelect(property)}
            >
              {property["Property Name"]}
            </SuggestionItem>
          ))}
        </Suggestions>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Suggestions = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  position: absolute;
  width: 100%;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li`
  padding: 0.5rem;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

export default PropertyList;
