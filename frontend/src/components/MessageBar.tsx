// Going to combine MessageBar and SearchBar into one generalised component in a later refactoring 
type MessageBarProps = {
    message: string;
    setMessage: (searchTerm: string) => void;
    submit: () => void;
}

export function MessageBar ( { message, setMessage, submit } : MessageBarProps) {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    };

    return (
        <form className="flex w-full gap-4" onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message...." 
                className="flex-1 w-7/8 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-black"
            />
            <button 
                type="submit"
                className="w-1/8 px-6 py-2 !bg-blue-500 text-white rounded-lg hover:!bg-blue-600 transition-colors cursor-pointer"
            >
                Send
            </button>
        </form>
    );
}