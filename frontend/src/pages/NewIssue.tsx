import { client } from "../App";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchableDropdown } from "../components/DropDown";
import { useState } from "react";

const CreateIssueSchema = z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    issueType: z.string().nullable(),
});

type CreateIssueForm = z.infer<typeof CreateIssueSchema>;

const exampleIssueType: string[] = [
    "Delay",
    "Cancellation",
    "Broken",
    "Other",
];
const exampleLocationType : string[] = [
    "Chancelor's Building",
    "1W",
    "2W",
    "University Hall",
    "Other"
];

const getSelectedOption = (value: string | null) => {
    if (!value) return null;
    const index = exampleIssueType.findIndex(type => type === value);
    if (index === -1) return null;
    return {
        id: index.toString(),
        label: value,
        value: value
    };
};

const defaultValues: CreateIssueForm = {
    title: "",
    description: "",
    location: "",
    issueType: "",
};

interface DropDownWrapperProps {
    options: string[],
    control: any,
    name: string
    placeholder: string
}

function DropDownWrapper({options, control, name, placeholder}: DropDownWrapperProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <SearchableDropdown 
                    options={options.map((issueType, index) => ({ 
                        id: index.toString(), 
                        label: issueType, 
                        value: issueType 
                    }))}
                    value={getSelectedOption(field.value)}
                    onSelect={(option) => field.onChange(option?.value || "")}
                    placeholder={placeholder}
                    searchPlaceholder="Search..."
                />
            )}
        />
    );
    
}

export function NewIssue() {
    const navigate = useNavigate();
    const [localError, setLocalError] = useState<string>("");

    const { handleSubmit, register, formState: { errors }, control,} = useForm<CreateIssueForm>({
        resolver: zodResolver(CreateIssueSchema),
        defaultValues,
    });

    const submitNewIssue = async (data: CreateIssueForm) => {
        if (!data.issueType && !data.title && !data.description && !data.location) {
            setLocalError("Fill in all fields");
            return;
        }
        
        setLocalError("");

        const { error } = await client.POST("/api/issues", {
            body: {
                title: data.title,
                description: data.description,
                locationUuid: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            },
        });

        if (!error) {
            navigate("/");
        }
    };

    return (
        <form onSubmit={handleSubmit(submitNewIssue)}>
            <DropDownWrapper options={exampleIssueType} control={control} name="issueType" placeholder="Issue Type"/>
            <DropDownWrapper options={exampleLocationType} control={control} name="location " placeholder="Location" />

            <div>
                <input {...register("title")} placeholder="Subject" />
                {errors.title && <span style={{ color: 'red' }}>{errors.title.message}</span>}
            </div>

            <div>
                <input {...register("description")} placeholder="Description" />
                {errors.description && <span style={{ color: 'red' }}>{errors.description.message}</span>}
            </div>

            <div>
                {localError && <span style={{ color: 'red' }}>{localError}</span>}
            </div>

            <button type="submit">Submit</button>
        </form>
    );
}