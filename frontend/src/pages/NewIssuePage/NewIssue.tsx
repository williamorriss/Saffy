import {useLocation, useNavigate} from "react-router-dom";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {useDefaultData} from "../../hooks/UseDefaultData.ts";
import { client, type Tag, type Location } from "../../api";
import SearchableDropdown, { type DropdownOption, fromTag, fromLocation } from "../../components/SearchableDropdown";

const CreateIssueSchema = z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    issueType: z.string().nullable(),
});

type CreateIssueForm = z.infer<typeof CreateIssueSchema>;


function getSelectedOption(options: DropdownOption[], value: string | null) : DropdownOption | null {
    if (!value) {
        return null;
    }
    const index = options.findIndex(option => option.label === value);
    if (index === -1) {
        return null;
    }
    return {
        id: index.toString(),
        label: value,
    };
}

const defaultValues: CreateIssueForm = {
    title: "",
    description: "",
    location: "",
    issueType: "",
};

interface DropDownWrapperProps {
    options: DropdownOption[],
    control: any,
    name: string
    placeholder: string,
    setValue: (value: any) => void
}

function DropDownWrapper({options, control, name, placeholder }: DropDownWrapperProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <SearchableDropdown
                    options={options}
                    value={getSelectedOption(options, field.value)}
                    onSelect={(option) => field.onChange(option?.label || "")}
                    placeholder={placeholder}
                    searchPlaceholder="Search..."
                />
            )}
        />
    );
    
}

export default function NewIssue() {
    const navigate = useNavigate();
    const { locations, tags } = useDefaultData();

    const [chosenLocation, setChosenLocation] = useState("");
    const [chosenTags, setChosenTags] = useState<Tag[]>([])
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
                locationId: "",
            },
            query: {
                
            }
        });

        if (!error) {
            navigate("/");
        }
    };

    return (
        <>
            {localError}
            <div className="relative w-4/5 mx-auto"> 
                <div className="absolute inset-0 bg-gray-800!"> </div>

                <div className="relative">
                    <div className="flex justify-left px-6 pb-0 pt-4 w-full">
                        <form onSubmit={handleSubmit(submitNewIssue)} className="flex flex-col gap-4 p-4 w-full">
                            <div className="flex flex-row w-full gap-4">
                                <DropDownWrapper options={tags.map(fromTag)} control={control} name="issueType" placeholder="Issue Type" setValue={setChosenTags}/>
                                <DropDownWrapper options={locations.map(fromLocation)} control={control} name="location " placeholder="Location" setValue={setChosenLocation}/>
                            </div>

                            <div className="flex flex-col gap-4">
                                <input {...register("title")} placeholder="Subject" className="w-full p-2 rounded bg-white text-black text-xl font-bold"/>
                                {errors.title && <span style={{ color: 'red' }}>{errors.title.message}</span>}
                                <textarea {...register("description")} rows={5} placeholder="Description" className="w-full p-2 rounded bg-white text-black"/>
                                {errors.description && <span style={{ color: 'red' }}>{errors.description.message}</span>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}