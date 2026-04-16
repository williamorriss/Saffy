import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { client, type CreateIssue } from "../../api";
import LocationSearch from "../../components/LocationSearch.tsx";
import TagSelectionBox from "../../components/TagSelectionBox.tsx";
import {useState} from "react";

const CreateIssueSchema = z.object({
    title: z.string(),
    description: z.string(),
    locationId: z.string().nullish(),
    tagNames: z.array(z.string()),
}) satisfies z.ZodType<CreateIssue>;

type CreateIssueForm = z.infer<typeof CreateIssueSchema>;

const defaultValues: CreateIssueForm = {
    title: "",
    description: "",
    locationId: undefined,
    tagNames: [],
};

interface DropDownWrapperProps {
    control: any;
    name: string;
}

function NewIssueLocationSearch({ control, name }: DropDownWrapperProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <LocationSearch
                    setLocation={(location) => field.onChange(location)}
                />
            )}
        />
    );
}

function NewIssueTagSelect({ control, name }: DropDownWrapperProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TagSelectionBox
                    setTags={(tags) => field.onChange(tags)}
                />
            )}
        />
    );
}

export default function NewIssue() {
    const navigate = useNavigate();
    const [localError, setLocalError] = useState<string>("");

    const { handleSubmit, register, formState: { errors }, control } = useForm<CreateIssueForm>({
        resolver: zodResolver(CreateIssueSchema),
        defaultValues,
    });

    const submitNewIssue = async (data: CreateIssueForm) => {
        if (!data.title && !data.description && !data.locationId) {
            setLocalError("Fill in all fields");
            return;
        }

        setLocalError("");

        const { error } = await client.POST("/api/issues", {
            body: {
                title: data.title,
                description: data.description,
                locationId: data.locationId,
                tagNames: data.tagNames,
            },
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
                                <NewIssueLocationSearch control={control} name="locationId" />
                                <NewIssueTagSelect control={control} name="tagNames" />
                            </div>
                            <div className="flex flex-col gap-4">
                                <input {...register("title")} placeholder="Subject" className="w-full p-2 rounded bg-white text-black text-xl font-bold"/>
                                {errors.title && <span style={{ color: 'red' }}>{errors.title.message}</span>}
                                <textarea {...register("description")} rows={5} placeholder="Description" className="w-full p-2 rounded bg-white text-black"/>
                                {errors.description && <span style={{ color: 'red' }}>{errors.description.message}</span>}
                            </div>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}