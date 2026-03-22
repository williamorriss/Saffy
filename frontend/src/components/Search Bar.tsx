import {client} from "../App";
import { useNavigate } from "react-router-dom";
import type { CreateIssue } from "./types";
import { CreateIssueSchema } from "../schemas";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";

import { useState } from "react";
export function SearchBar () {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [data, setData] = useState("");

    const form = useForm({
        resolver: zodResolver(CreateIssueSchema.omit({locationUuid : "3fa85f64-5717-4562-b3fc-2c963f66afa6"})),
    });

    const submitSearch = async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const { error }
            = await client.GET("/api/issues", {body : {
                title: form.get("title"),
        });

        if (!error) {
            navigate("/");
        }
    }

    return (
        <form onSubmit={submitNewIssue}>
            <input {...register("query")} placeholder="Searching...." />
            <input type="submit" />
        </form>
    );
}