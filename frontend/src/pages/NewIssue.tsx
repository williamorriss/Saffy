import { client } from "../App";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateIssueSchema = z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
});

type CreateIssueForm = z.infer<typeof CreateIssueSchema>;

export function NewIssue() {
    const navigate = useNavigate();

    const { handleSubmit, register, formState: { errors } } = useForm<CreateIssueForm>({
        resolver: zodResolver(CreateIssueSchema),
    });

    const submitNewIssue = async (data: CreateIssueForm) => {
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
            <input {...register("title")} placeholder="Subject" />
            {errors.title && <span>{errors.title.message}</span>}

            <input {...register("description")} placeholder="Description" />
            {errors.description && <span>{errors.description.message}</span>}

            <input type="submit" />
        </form>
    );
}