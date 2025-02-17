import React from 'react';
import { FaCircleCheck } from "react-icons/fa6";


export const SuccessToast = ({ link }) => {
    return (
        <div className="flex items-center justify-between w-auto min-w-[300px] p-2 bg-white shadow-md rounded-md ring-1 ring-red-500">
            <div className='flex items-center' >
                <FaCircleCheck className='text-green w-5 h-5' />
                <p className='text-black text-md font-normal pl-2' >Transaction Successful</p>
            </div>
            <a href={link} target='_blank' className='bg-lime-200 py-1 px-4 text-green rounded-sm font-semibold'  >View</a>
        </div>
    );
};
