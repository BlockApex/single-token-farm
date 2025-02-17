import React, { useState } from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Image,
    Button,
    Text,
} from "@chakra-ui/react";
import { InfoTooltip } from '../shared';
import { QuestionMarkOutlinedIcon } from '@/assets/svg/question-mark-icon';
import { RoundCross } from '@/assets/svg';



const TooltipContent = () => {
    return (
        <div className="p-2">
            <p className="text-white-400">
                <b>Tutorial Tips:</b> This is to register whitelisted tokens to enable swap functionality. This is for one time only.
               
            </p>
        </div>
    );
};


const gradientStyle = {
    background:
        "radial-gradient(circle, rgba(174,108,198,1) 65%, rgba(112,112,238,1) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "transparent",
    display: "inline",
};




const RegisterAccountModal = ({open , handleSubmit , handleClose}) => {
    

    return (
        <Modal isCentered isOpen={open} onClose={() => null}>
            <ModalOverlay />
            <ModalContent
                backgroundColor="#5F456A"
                maxW="600px"
                minW="400px"
                width="90%"
                // maxH="800"
                // overflowY="scroll"
                // marginTop={10}
            >
                <ModalHeader>
                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
                        Register Tokens 
                            <InfoTooltip label={<TooltipContent />}>
                                <span className="ml-2 mt-1">
                                    <QuestionMarkOutlinedIcon className="w-4 h-4" />
                                </span>
                            </InfoTooltip>
                        </h2>
                                     <button onClick={handleClose}>
                                       <RoundCross />
                                     </button>
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="w-full h-auto relative">
                        <p className="text-[#9CA3AF] font-semibold text-sm">
                        You need to register the tokens to proceed with the transactions
                        </p>
                        {/* <ul className='text-[#9CA3AF] font-normal text-sm mt-4' >
                            <li className='mb-2' >1- Lorem Ipsum is simply dummy text of the printing and typesetting industry.</li>
                            <li className='mb-2' >2- Lorem Ipsum is simply dummy text of the printing and typesetting industry.</li>
                            <li className='mb-2' >3- Lorem Ipsum is simply dummy text of the printing and typesetting industry.</li>
                        </ul> */}

                        <Button
                            bg="#2b011a"
                            size="lg"
                            width="full"
                            height="54px"
                            my={6}
                            rounded="lg"
                            fontWeight="bold"
                            variant="outline"
                            onClick={handleSubmit}
                        >
                            <Text sx={{ ...gradientStyle, fontSize: "24px" }}>
                                Register Token
                            </Text>
                        </Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>

    )
}

export default RegisterAccountModal