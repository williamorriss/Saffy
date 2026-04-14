import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { client, type Tag, type Location, type CreateIssue } from "../../api";
import LocationSearch from "../../components/LocationSearch.tsx";
import { TagSelectionBox } from "../../components/TagFilter.tsx";

const CreateIssueSchema = z.object({
    title: z.string(),
    description: z.string(),
    location: z.string().nullable(),
}) satisfies z.ZodType<CreateIssue>;

type CreateIssueForm = z.infer<typeof CreateIssueSchema>;


const defaultValues: CreateIssueForm = {
    title: "",
    description: "",
    location: "",
};

interface DropDownWrapperProps {
    control: any,
    name: string
    placeholder: string,
    setValue: (value: any) => void
}

function NewIssueLocationSearch({ control, name, placeholder }: DropDownWrapperProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <LocationSearch
                    onSelect={(option) => field.onChange(option)}
                    placeholder={placeholder}
                />
            )}
        />
    );

}

export default function NewIssue() {
    const navigate = useNavigate();

    const [location, setLocation] = useState<Location|null>(null);
    const [tags, setTags] = useState<Tag[]>([])
    const [localError, setLocalError] = useState<string>("");
    const [tagSelectionVisible, setTagSelectionVisible] = useState(true);

    const { handleSubmit, register, formState: { errors }, control,} = useForm<CreateIssueForm>({
        resolver: zodResolver(CreateIssueSchema),
        defaultValues,
    });

    const submitNewIssue = async (data: CreateIssueForm) => {
        if (!data.title && !data.description && !data.location) {
            setLocalError("Fill in all fields");
            return;
        }

        setLocalError("");

        const { error } = await client.POST("/api/issues", {
            body: {
                title: data.title,
                description: data.description,
                locationId: location?.id,
            },
            query: { tags }
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
                                <NewIssueLocationSearch control={control} name="issueType" placeholder="Issue Type" setValue={setLocation} />
                                <TagSelectionBox visible={tagSelectionVisible} tags={tags} setTags={setTags} />

                            </div>

                            <div className="flex flex-col gap-4">
                                <input {...register("title")} placeholder="Subject" className="w-full p-2 rounded bg-white text-black text-xl font-bold"/>
                                {errors.title && <span style={{ color: 'red' }}>{errors.title.message}</span>}
                                <textarea {...register("description")} rows={5} placeholder="Description" className="w-full p-2 rounded bg-white text-black"/>
                                {errors.description && <span style={{ color: 'red' }}>{errors.description.message}</span>}
                            </div>
                            <button ></button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}