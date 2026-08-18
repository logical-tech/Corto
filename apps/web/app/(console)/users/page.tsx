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
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  SearchIcon,
  ShieldBanIcon,
  ShieldCheckIcon,
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

export default function UsersPage() {
  const { t, i18n } = useTranslation("settings")
  const { t: common } = useTranslation("common")
  const { t: auth } = useTranslation("auth")
  const client = useQueryClient()
  const { data: session } = authClient.useSession()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState(emptyUser)
  const [passwordUser, setPasswordUser] = useState<{
    id: string
    name: string
  } | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const users = useQuery({
    queryKey: ["users", search, page],
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
        },
      })
      if (response.error) throw new Error(response.error.message)
      return response.data
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            {t("userManagement")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("userManagementDescription")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {users.data ? (
            <Badge variant="outline">
              {t("userCount", { count: users.data.total })}
            </Badge>
          ) : null}
          <Button
            onClick={() => {
              createUser.reset()
              setCreateOpen(true)
            }}
          >
            <UserPlusIcon data-icon="inline-start" />
            {t("createUser")}
          </Button>
        </div>
      </header>

      <Card className="surface-shadow gap-0 overflow-hidden py-0">
        <CardHeader className="flex-row items-center justify-between gap-4 px-5 pt-5 sm:px-6">
          <div className="space-y-1.5">
            <CardTitle>{common("users")}</CardTitle>
            <CardDescription>{t("usersDescription")}</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              className="pl-9"
              placeholder={t("searchUsers")}
              aria-label={t("searchUsers")}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-5">
          {users.isPending ? <Skeleton className="mx-5 h-80 sm:mx-6" /> : null}
          {users.isError ? (
            <Alert variant="destructive" className="mx-5 sm:mx-6">
              <TriangleAlertIcon />
              <AlertTitle>{t("userManagementUnavailable")}</AlertTitle>
              <AlertDescription>{users.error.message}</AlertDescription>
            </Alert>
          ) : null}
          {users.isSuccess && users.data.users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center text-muted-foreground sm:px-6">
              <UsersRoundIcon className="size-7" />
              <p>{t("noUsers")}</p>
            </div>
          ) : null}
          {users.isSuccess && users.data.users.length > 0 ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-5 sm:px-6">
                        {t("user")}
                      </TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{common("status")}</TableHead>
                      <TableHead>{common("created")}</TableHead>
                      <TableHead className="px-5 text-right sm:px-6">
                        {common("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data.users.map((user) => {
                      const isCurrentUser = user.id === session?.user.id
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="px-5 sm:px-6">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role || "user"}
                              disabled={isCurrentUser || updateRole.isPending}
                              onValueChange={(role) =>
                                updateRole.mutate({
                                  userId: user.id,
                                  role: role as "admin" | "user",
                                })
                              }
                            >
                              <SelectTrigger
                                aria-label={t("role")}
                                className="w-32"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="start">
                                <SelectGroup>
                                  <SelectItem value="user">
                                    {t("member")}
                                  </SelectItem>
                                  <SelectItem value="admin">
                                    {t("administrator")}
                                  </SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.banned ? "destructive" : "outline"}
                            >
                              {user.banned ? t("banned") : common("active")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(
                              user.createdAt.toISOString(),
                              i18n.resolvedLanguage
                            )}
                          </TableCell>
                          <TableCell className="px-5 sm:px-6">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  isCurrentUser ||
                                  toggleBan.isPending ||
                                  removeUser.isPending
                                }
                                onClick={() =>
                                  toggleBan.mutate({
                                    userId: user.id,
                                    banned: Boolean(user.banned),
                                  })
                                }
                              >
                                {user.banned ? (
                                  <ShieldCheckIcon data-icon="inline-start" />
                                ) : (
                                  <ShieldBanIcon data-icon="inline-start" />
                                )}
                                {user.banned ? t("unbanUser") : t("banUser")}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger
                                  disabled={
                                    isCurrentUser || removeUser.isPending
                                  }
                                  render={
                                    <Button variant="ghost" size="icon-sm" />
                                  }
                                >
                                  <Trash2Icon />
                                  <span className="sr-only">
                                    {t("deleteUser")}
                                  </span>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("deleteUser")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("deleteUserDescription", {
                                        name: user.name,
                                      })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {common("cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      disabled={removeUser.isPending}
                                      onClick={() => removeUser.mutate(user.id)}
                                    >
                                      {t("deleteUser")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={setUserPassword.isPending}
                                aria-label={t("setUserPassword")}
                                onClick={() => {
                                  setUserPassword.reset()
                                  setNewPassword("")
                                  setPasswordUser({
                                    id: user.id,
                                    name: user.name,
                                  })
                                }}
                              >
                                <KeyRoundIcon />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="grid gap-3 px-5 md:hidden">
                {users.data.users.map((user) => {
                  const isCurrentUser = user.id === session?.user.id
                  return (
                    <div key={user.id} className="rounded-2xl border p-4">
                      <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <Badge
                          variant={user.banned ? "destructive" : "outline"}
                        >
                          {user.banned ? t("banned") : common("active")}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Select
                          value={user.role || "user"}
                          disabled={isCurrentUser || updateRole.isPending}
                          onValueChange={(role) =>
                            updateRole.mutate({
                              userId: user.id,
                              role: role as "admin" | "user",
                            })
                          }
                        >
                          <SelectTrigger
                            aria-label={t("role")}
                            className="w-32"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent align="start">
                            <SelectGroup>
                              <SelectItem value="user">
                                {t("member")}
                              </SelectItem>
                              <SelectItem value="admin">
                                {t("administrator")}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              isCurrentUser ||
                              toggleBan.isPending ||
                              removeUser.isPending
                            }
                            onClick={() =>
                              toggleBan.mutate({
                                userId: user.id,
                                banned: Boolean(user.banned),
                              })
                            }
                          >
                            {user.banned ? t("unbanUser") : t("banUser")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              disabled={isCurrentUser || removeUser.isPending}
                              render={
                                <Button variant="outline" size="icon-sm" />
                              }
                            >
                              <Trash2Icon />
                              <span className="sr-only">{t("deleteUser")}</span>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("deleteUser")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("deleteUserDescription", {
                                    name: user.name,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {common("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={removeUser.isPending}
                                  onClick={() => removeUser.mutate(user.id)}
                                >
                                  {t("deleteUser")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={setUserPassword.isPending}
                            aria-label={t("setUserPassword")}
                            onClick={() => {
                              setUserPassword.reset()
                              setNewPassword("")
                              setPasswordUser({ id: user.id, name: user.name })
                            }}
                          >
                            <KeyRoundIcon />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : null}
        </CardContent>
        {users.isSuccess && users.data.users.length > 0 ? (
          <div className="flex items-center justify-between border-t px-5 py-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              {t("pageOf", { page: page + 1, total: pageCount })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                {t("next")}
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

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
