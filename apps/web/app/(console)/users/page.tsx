"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  KeyRoundIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatDate } from "@/lib/format"
import { authClient } from "@/lib/auth-client"

const pageSize = 20
const emptyUser: {
  name: string
  email: string
  password: string
  role: "admin" | "user"
} = { name: "", email: "", password: "", role: "user" }

const filters = {
  all: undefined,
  admin: { filterField: "role", filterValue: "admin" },
  user: { filterField: "role", filterValue: "user" },
  banned: { filterField: "banned", filterValue: true },
} as const
type Filter = keyof typeof filters

async function countUsers(filter: Filter) {
  const response = await authClient.admin.listUsers({
    query: { limit: 1, filterOperator: "eq", ...filters[filter] },
  })
  if (response.error) throw new Error(response.error.message)
  return response.data.total
}

export default function UsersPage() {
  const { t, i18n } = useTranslation("settings")
  const { t: common } = useTranslation("common")
  const { t: auth } = useTranslation("auth")
  const client = useQueryClient()
  const { data: session } = authClient.useSession()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState(emptyUser)
  const [passwordUser, setPasswordUser] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const users = useQuery({
    queryKey: ["users", search, filter, page],
    queryFn: async () => {
      const response = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: page * pageSize,
          searchValue: search || undefined,
          searchField: "email",
          searchOperator: "contains",
          sortBy: "createdAt",
          sortDirection: "desc",
          filterOperator: "eq",
          ...filters[filter],
        },
      })
      if (response.error) throw new Error(response.error.message)
      return response.data
    },
  })
  const counts = useQuery({
    queryKey: ["users", "counts"],
    queryFn: async () => {
      const keys = Object.keys(filters) as Filter[]
      const totals = await Promise.all(keys.map(countUsers))
      return Object.fromEntries(
        keys.map((key, index) => [key, totals[index]])
      ) as Record<Filter, number>
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string
      role: "admin" | "user"
    }) => {
      const response = await authClient.admin.setRole({ userId, role })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["users"] })
      toast.add({ title: t("userUpdated"), type: "success" })
    },
  })

  const toggleBan = useMutation({
    mutationFn: async ({
      userId,
      banned,
    }: {
      userId: string
      banned: boolean
    }) => {
      const response = banned
        ? await authClient.admin.unbanUser({ userId })
        : await authClient.admin.banUser({
            userId,
            banReason: "Administrative action",
          })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: (_, variables) => {
      void client.invalidateQueries({ queryKey: ["users"] })
      toast.add({
        title: variables.banned ? t("userUnbanned") : t("userBanned"),
        type: "success",
      })
    },
  })

  const createUser = useMutation({
    mutationFn: async () => {
      const response = await authClient.admin.createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setCreateOpen(false)
      setNewUser(emptyUser)
      void client.invalidateQueries({ queryKey: ["users"] })
      toast.add({ title: t("userCreated"), type: "success" })
    },
  })

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.removeUser({ userId })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setDeleteTarget(null)
      if (users.data?.users.length === 1) {
        setPage((current) => Math.max(0, current - 1))
      }
      void client.invalidateQueries({ queryKey: ["users"] })
      toast.add({ title: t("userDeleted"), type: "success" })
    },
  })

  const setUserPassword = useMutation({
    mutationFn: async () => {
      if (!passwordUser) return
      const response = await authClient.admin.setUserPassword({
        userId: passwordUser.id,
        newPassword,
      })
      if (response.error) throw new Error(response.error.message)
    },
    onSuccess: () => {
      setPasswordUser(null)
      setNewPassword("")
      toast.add({ title: t("passwordUpdated"), type: "success" })
    },
  })

  const pageCount = users.data
    ? Math.max(1, Math.ceil(users.data.total / pageSize))
    : 1
  const canGoNext = Boolean(users.data && page + 1 < pageCount)
  const error =
    users.error ??
    updateRole.error ??
    toggleBan.error ??
    removeUser.error ??
    setUserPassword.error
  type User = NonNullable<typeof users.data>["users"][number]

  const filterLabels: Record<Filter, string> = {
    all: t("filterAll"),
    admin: t("filterAdmins"),
    user: t("filterMembers"),
    banned: t("banned"),
  }

  const avatar = (user: User) => (
    <div
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold uppercase",
        user.banned
          ? "bg-subtle-foreground text-background"
          : "bg-foreground text-background"
      )}
    >
      {user.name.charAt(0)}
    </div>
  )

  const identity = (user: User) => (
    <div className="flex min-w-0 items-center gap-3.5">
      {avatar(user)}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-baseline gap-1.5 truncate text-[15px] font-semibold">
          <span className="truncate">{user.name}</span>
          {user.id === session?.user.id ? (
            <span className="text-[13px] font-normal text-muted-foreground">
              {t("you")}
            </span>
          ) : null}
        </p>
        <p className="truncate text-[13px] text-muted-foreground">
          {user.email}
        </p>
      </div>
    </div>
  )

  const roleSelect = (user: User) => (
    <Select
      items={{ user: t("member"), admin: t("admin") }}
      value={user.role || "user"}
      disabled={user.id === session?.user.id || updateRole.isPending}
      onValueChange={(role) =>
        updateRole.mutate({
          userId: user.id,
          role: role as "admin" | "user",
        })
      }
    >
      <SelectTrigger
        aria-label={t("role")}
        className="h-9 w-fit min-w-24 gap-1.5 px-3 font-medium"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          <SelectItem value="user">{t("member")}</SelectItem>
          <SelectItem value="admin">{t("administrator")}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  const statusPill = (user: User) => (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold",
        user.banned
          ? "bg-muted text-muted-foreground"
          : "bg-success-soft text-success"
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {user.banned ? t("banned") : common("active")}
    </span>
  )

  const actions = (user: User) => {
    const isCurrentUser = user.id === session?.user.id
    return (
      <div className="flex items-center justify-end gap-3">
        {isCurrentUser ? null : (
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold"
            disabled={toggleBan.isPending || removeUser.isPending}
            onClick={() =>
              toggleBan.mutate({
                userId: user.id,
                banned: Boolean(user.banned),
              })
            }
          >
            {user.banned ? t("unbanUser") : t("banUser")}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                aria-label={t("moreActions", { name: user.name })}
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={setUserPassword.isPending}
              onClick={() => {
                setUserPassword.reset()
                setNewPassword("")
                setPasswordUser({ id: user.id, name: user.name })
              }}
            >
              <KeyRoundIcon />
              {t("setUserPassword")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={isCurrentUser || removeUser.isPending}
              onClick={() => {
                removeUser.reset()
                setDeleteTarget({ id: user.id, name: user.name })
              }}
            >
              <Trash2Icon />
              {t("deleteUser")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const showingFrom = page * pageSize + 1
  const showingTo = page * pageSize + (users.data?.users.length ?? 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.6px]">
            {common("users")}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            {t("userManagementDescription")}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full px-6 sm:w-fit"
          onClick={() => {
            createUser.reset()
            setCreateOpen(true)
          }}
        >
          <UserPlusIcon data-icon="inline-start" />
          {t("createUser")}
        </Button>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="relative w-full md:w-[340px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            type="search"
            className="rounded-full pl-10"
            placeholder={t("searchUsers")}
            aria-label={t("searchUsers")}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
          />
        </div>
        <div
          role="group"
          aria-label={t("filterUsers")}
          className="flex flex-wrap gap-2 md:gap-3"
        >
          {(Object.keys(filters) as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key)
                setPage(0)
              }}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors outline-none hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/30",
                filter === key
                  ? "border-foreground bg-muted font-semibold ring-1 ring-foreground"
                  : "border-border bg-background"
              )}
            >
              {filterLabels[key]}
              {counts.data ? ` · ${counts.data[key]}` : null}
            </button>
          ))}
        </div>
      </div>

      {users.isPending ? <Skeleton className="h-80 rounded-2xl" /> : null}
      {users.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{t("userManagementUnavailable")}</AlertTitle>
          <AlertDescription>{users.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {users.isSuccess && users.data.users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border px-5 py-16 text-center text-muted-foreground">
          <UsersRoundIcon className="size-7" />
          <p>{t("noUsers")}</p>
        </div>
      ) : null}
      {users.isSuccess && users.data.users.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
            <Table>
              <TableHeader className="bg-muted [&_tr]:border-0">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-auto px-6 py-3.5 text-[13px] font-semibold text-muted-foreground">
                    {t("user")}
                  </TableHead>
                  <TableHead className="h-auto py-3.5 text-[13px] font-semibold text-muted-foreground">
                    {t("role")}
                  </TableHead>
                  <TableHead className="h-auto py-3.5 text-[13px] font-semibold text-muted-foreground">
                    {common("status")}
                  </TableHead>
                  <TableHead className="h-auto py-3.5 text-[13px] font-semibold text-muted-foreground">
                    {common("created")}
                  </TableHead>
                  <TableHead className="h-auto px-6 py-3.5">
                    <span className="sr-only">{common("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-border-soft hover:bg-transparent"
                  >
                    <TableCell className="px-6 py-4">
                      {identity(user)}
                    </TableCell>
                    <TableCell className="py-4">{roleSelect(user)}</TableCell>
                    <TableCell className="py-4">{statusPill(user)}</TableCell>
                    <TableCell className="py-4 text-sm text-muted-foreground">
                      {formatDate(
                        user.createdAt.toISOString(),
                        i18n.resolvedLanguage
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">{actions(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {users.data.users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-4 rounded-2xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {identity(user)}
                  {statusPill(user)}
                </div>
                <div className="flex items-center justify-between gap-3">
                  {roleSelect(user)}
                  {actions(user)}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("showingUsers", {
                from: showingFrom,
                to: showingTo,
                total: users.data.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                aria-label={t("previous")}
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                aria-label={t("next")}
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !removeUser.isPending) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteUser")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteUserDescription", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeUser.isPending}
              onClick={() => {
                if (deleteTarget) removeUser.mutate(deleteTarget.id)
              }}
            >
              {t("deleteUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createUser")}</DialogTitle>
            <DialogDescription>{t("createUserDescription")}</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              createUser.mutate()
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="user-name">{t("fullName")}</Label>
              <Input
                id="user-name"
                value={newUser.name}
                required
                minLength={2}
                autoComplete="name"
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">{auth("email")}</Label>
              <Input
                id="user-email"
                type="email"
                value={newUser.email}
                required
                autoComplete="email"
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">{t("temporaryPassword")}</Label>
              <Input
                id="user-password"
                type="password"
                value={newUser.password}
                required
                minLength={8}
                autoComplete="new-password"
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-role">{t("role")}</Label>
              <Select
                items={{ user: t("member"), admin: t("administrator") }}
                value={newUser.role}
                onValueChange={(role) =>
                  setNewUser((current) => ({
                    ...current,
                    role: role as "admin" | "user",
                  }))
                }
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="user">{t("member")}</SelectItem>
                  <SelectItem value="admin">{t("administrator")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createUser.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("userCreateFailed")}</AlertTitle>
                <AlertDescription>{createUser.error.message}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createUser.isPending}
                onClick={() => setCreateOpen(false)}
              >
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {t("createUser")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open && !setUserPassword.isPending) {
            setPasswordUser(null)
            setNewPassword("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("setUserPassword")}</DialogTitle>
            <DialogDescription>
              {t("setUserPasswordDescription", {
                name: passwordUser?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setUserPassword.mutate()
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="new-user-password">{auth("password")}</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newPassword}
                required
                minLength={8}
                autoComplete="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            {setUserPassword.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("passwordUpdateFailed")}</AlertTitle>
                <AlertDescription>
                  {setUserPassword.error.message}
                </AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={setUserPassword.isPending}
                onClick={() => {
                  setPasswordUser(null)
                  setNewPassword("")
                }}
              >
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={setUserPassword.isPending}>
                {t("setUserPassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {error &&
      !users.isError &&
      !createUser.isError &&
      !setUserPassword.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>
            {removeUser.isError ? t("userDeleteFailed") : t("userUpdateFailed")}
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
