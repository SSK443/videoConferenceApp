// src/components/CreatePoll.jsx

import React, { useState } from "react";

const CreatePoll = ({ onCreate, onCancel }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 5) {
      // Limit to 5 options
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      // Require at least 2 options
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (question.trim() && validOptions.length >= 2) {
      onCreate({ question, options: validOptions });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Create a New Poll
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-300"
            >
              Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Options
            </label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 bg-red-600 rounded-full text-white flex-shrink-0 w-8 h-8 flex items-center justify-center"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-sm text-blue-400 hover:underline"
              >
                + Add Option
              </button>
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-md"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;
