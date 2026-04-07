type InputBarProp = {
    placeholder: string;
    buttonText: string;
    inputTerm: string;
    setInput: (inputTerm: string) => void;
    onSubmit: () => void;
}

export function InputBar ( { placeholder, buttonText, inputTerm, setInput, onSubmit } : InputBarProp) {

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form className="flex w-full gap-4 p-4" onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={inputTerm}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 w-7/8 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-black"
            />
            <button 
                type="submit"
                className="w-1/8 px-6 py-2 !bg-blue-500 text-white rounded-lg hover:!bg-blue-600 transition-colors cursor-pointer"
            >
                {buttonText}
            </button>
        </form>
    );
}