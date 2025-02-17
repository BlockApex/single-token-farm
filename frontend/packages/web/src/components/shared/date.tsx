import { useEffect, useRef } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { AiFillCaretDown } from 'react-icons/ai';

// const formatDate = (date: string): string => {
//     const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
//     return new Date(date).toLocaleDateString('en-GB', options);
// };

export const DateInput = ({ selectedDate, setSelectedDate }) => {


    // useEffect(() => {
    //     const today = new Date();
    //     setSelectedDate(formatDate(today.toISOString()));
    // }, [setSelectedDate]);

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // const formattedDate = formatDate(event.target.value);
        setSelectedDate(event.target.value);
    };



    const today = new Date().toISOString().split("T")[0];
    const maxDate = "2038-12-31";


    return (
        <div className="relative inline-flex items-center">
            <input
                id="date"
                type="date"
                onChange={handleDateChange}
                min={today}
                max={maxDate}  // 10 years from today as maximum
                className="bg-[#00000033] text-white rounded-sm min-w-full  md:min-w-[185px] min-h-[36px] cursor-pointer border-none"
            />
        </div>
    );
};
