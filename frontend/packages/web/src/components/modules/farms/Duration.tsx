import { Button } from "@chakra-ui/react";

const Duration = ({ duration, setDuration }) => {
  const durations = [1, 3, 6, 12];
  return (
    <div className="w-full md:w-[70%] flex items-center justify-start">
      <section className="w-full bg-[#47272D] h-[26px] flex items-center rounded-full">
        {durations.map((value, index) => (
          <Button
            id={index.toString()}
            key={value}
            onClick={() => setDuration(value)}
            flex="1"
            borderRadius="full"
            height="full"
            bg={duration === value ? "#572550" : "transparent"}
            // color="white"
            _hover={{ bg: "#4d3059" }}
            _active={{ bg: "#572550" }}
            className="text-sm text-white font-normal p-3"
          >
            {value} M
          </Button>
        ))}
      </section>
    </div>
  );
};

export default Duration;
