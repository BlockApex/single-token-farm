import * as Yup from "yup";

export const validationSchema = Yup.object({
  value: Yup.string().required("Value is a required value"),
});

type IFormValues = {
  value: string;
};

export const initialValues = {
  value: "0",
} as IFormValues;
