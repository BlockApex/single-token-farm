import React from 'react';
import { MdCancel } from "react-icons/md";

export const ErrorToast = ({ link }) => {
    return (
        <div className="flex items-center justify-between w-auto min-w-[300px] p-2 bg-white shadow-md rounded-md ring-1 ring-red-500">
            <div className='flex items-center' >
                <MdCancel className='text-red w-5 h-5' />
                <p className='text-black text-md font-normal pl-2' >Transaction Failed</p>
            </div>
            <a href={link} target='_blank' className='bg-rose-300 py-1 px-4 text-red rounded-sm font-semibold'  >View</a>
        </div>
    );
};
